using ez.data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class admin_pro_reg : ez.admin.PageBase
{
    region region = new region();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            store store = new store();

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
            }

            store.initStatusOptions(status);
            if (status.Items.Count > 0) { status.SelectedIndex = 0; }            

            if (!isStrNull(Request["num"]))
            {
                if (store.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";
                    store.DataInfo info = store.Data;
                    nation.SelectedValue = info.nation;
                    initKindOptions();
                    if (info.kind.HasValue) { kind.SelectedValue = info.kind.Value.ToString(); }
                    cityInit();
                    if (info.city.HasValue) { city.SelectedValue = info.city.Value.ToString(); }
                    areaInit();
                    if (info.area.HasValue) { area.SelectedValue = info.area.Value.ToString(); }
                    initAreasOptions();
                    ArrayStringToCheckBoxList(info.areas, areas);
                    pro_num.Value = info.pro_num;
                    pro_name.Value = info.pro_name;
                    level.Value = info.level;
                    address.Value = info.address;
                    postnumber.Value = info.postnumber;
                    status.SelectedValue = info.status;
                    picInit(info.pic);
                }
                else
                {
                    Response.Write(store.log);
                    ScriptMsg("查無資料", "index.aspx" + rtnQueryString("num"));
                }
                goBack.Visible = true;
                goBack.NavigateUrl = "index.aspx" + rtnQueryString("num");

            }
            else
            {
                initKindOptions();
                cityInit();
                areaInit();
                initAreasOptions();
                mode.Value = "add";
                string[] pic = new string[store.picMax];
                picInit(pic);
            }
        }

    }

    #region 分類/語系

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        initKindOptions();
        cityInit();
        areaInit();
        initAreasOptions();
    }

    protected void initKindOptions()
    {
        kind.Items.Clear();
        kind.Items.Add(new ListItem(""));
        if (!isStrNull(nation.SelectedValue))
        {
            store.kind kindFunction = new store.kind();
            kindFunction.InitOptions(kind, nation.SelectedValue);
        }
    }

    #endregion

    #region 縣市

    protected void initAreasOptions()
    {
        areas.Items.Clear();
        if (!isStrNull(nation.SelectedValue))
        {
            region.InitOptions(areas, 0, nation.SelectedValue);
        }
    }

    protected void cityInit()
    {
        city.Items.Clear();
        if (!isStrNull(nation.SelectedValue))
        {
            region.InitOptions(city, 0, nation.SelectedValue);
            if (city.Items.Count > 0)
            {
                city.Items.Insert(0, new ListItem(_t("請選擇"), ""));
                cityPlaceHolder.Visible = true;
            }
            else
            {
                cityPlaceHolder.Visible = false;
            }
        }
        else
        {
            cityPlaceHolder.Visible = false;
        }

    }

    protected void areaInit()
    {
        area.Items.Clear();
        if (!isStrNull(nation.SelectedValue))
        {
            if (!isStrNull(city.SelectedValue))
            {
                region.InitOptions(area, Val(city.SelectedValue), nation.SelectedValue);
            }
            if (area.Items.Count > 0)
            {
                area.Items.Insert(0, new ListItem(_t("請選擇"), ""));
                areaPlaceHolder.Visible = true;
            }
            else
            {
                areaPlaceHolder.Visible = false;
            }
        }
        else
        {
            areaPlaceHolder.Visible = false;
        }
    }

    protected void getZip()
    {
        postnumber.Value = "";
        if (areaPlaceHolder.Visible && !isStrNull(area.SelectedValue))
        {
            postnumber.Value = region.getZip(Val(area.SelectedValue));
        }
        else if (cityPlaceHolder.Visible && !isStrNull(city.SelectedValue))
        {
            postnumber.Value = region.getZip(Val(city.SelectedValue));
        }
    }

    protected void city_SelectedIndexChanged(object sender, EventArgs e)
    {
        areaInit();
        getZip();
    }

    protected void area_SelectedIndexChanged(object sender, EventArgs e)
    {
        getZip();
    }

    #endregion

    #region 圖片

    protected void picInit(string[] pic)
    {
        DataTable picDt = new DataTable();
        picDt.Columns.Add("row");
        picDt.Columns.Add("pic");
        for (int i = 0; i < pic.Length; i++)
        {
            DataRow tr = picDt.NewRow();
            tr["row"] = i + 1;
            tr["pic"] = (!isStrNull(pic[i]) ? pic[i] : "");
            picDt.Rows.Add(tr);
        }
        picRepeater.DataSource = picDt;
        picRepeater.DataBind();
        if (picDt.Rows.Count == 0) { picPanel.Visible = false; }
    }

    protected void picRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (!isStrNull(row["pic"]))
        {
            store store = new store();
            ((CheckBox)e.Item.FindControl("delpic")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).NavigateUrl = store.Dir + row["pic"].ToString();
            ((Image)e.Item.FindControl("Image1")).ImageUrl = "~/app_script/DisplayCut.ashx?rootDir=" + store.Dir.Replace("~/", "") + "&File=" + row["pic"].ToString() + "&W=100&H=100";
        }


    }

    #endregion

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {

            msg.Text = "";

            //圖片處理=====
            string[] pic = new string[1];
            store store = new store();
            if (store.picMax > 0)
            {
                ez.fileSystem fileSystem = new ez.fileSystem();
                string[] pic_name = fileSystem.UploadPhoto(store.Dir, 1024);
                pic = new string[store.picMax];
                for (int i = 0; i < store.picMax; i++)
                {
                    HiddenField orgPic = (HiddenField)picRepeater.Items[i].FindControl("pic");  //目前已存在的檔案
                    CheckBox orgDel = (CheckBox)picRepeater.Items[i].FindControl("delpic");  //是否要刪除
                    pic[i] = orgPic.Value;
                    string delFile = "";
                    if (!isStrNull(pic_name[i]))
                    { pic[i] = pic_name[i]; delFile = orgPic.Value; }
                    else if (orgDel.Checked)
                    { pic[i] = ""; delFile = orgPic.Value; }
                    if (!isStrNull(delFile) && !isStrNull(Request["num"]))
                    {
                        if (!store.picIsUse(delFile, Val(Request["num"]))) { fileSystem.Delete(store.Dir + delFile); }//刪除舊檔          
                    }
                }
            }


            //寫入資料====-
            store.DataInfo info = new store.DataInfo();
            info.nation = nation.SelectedValue;
            info.pro_num = pro_num.Value.Trim(); 
            info.pro_name = pro_name.Value.Trim();
            info.level = level.Value.Trim(); 
            info.kind = Val(kind.SelectedValue);
            if (cityPlaceHolder.Visible) { info.city = Val(city.SelectedValue); }
            if (areaPlaceHolder.Visible) { info.area = Val(area.SelectedValue); }
            info.address = address.Value;
            info.postnumber = postnumber.Value;
            info.areas = CheckBoxListToArrayString(areas);
            info.status = status.SelectedValue;
            info.pic = pic;

            switch (mode.Value)
            {
                case "add":
                    store.Data = info;
                    if (store.Add())
                    {
                        Response.Redirect("index.aspx");
                    }
                    else { msg.Text = store.log; }
                    break;
                case "edit":
                    info.num = Val(Request["num"]);
                    store.Data = info;
                    if (store.Edit())
                    {
                        Response.Redirect("index.aspx" + rtnQueryString("num"));
                    }
                    else { msg.Text = store.log; }
                    break;
                default:
                    break;
            }

        }
    }

    #endregion




}